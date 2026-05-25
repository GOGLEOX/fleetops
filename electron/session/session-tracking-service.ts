import type { FleetOpsRepositories } from '../db/repositories'
import type {
  FuelEventRecord,
  NewFinanceEntryRecord,
  SessionRecord,
  TripRecord,
  TruckRecord,
} from '../../src/lib/persistence/contracts'
import type { RegisterDetectedTruckInput } from '../../src/lib/fleet/contracts'
import type {
  NormalizedTelemetryEvent,
  NormalizedTelemetryFrame,
} from '../../src/lib/telemetry/contracts'
import type { SessionTrackingSnapshot } from '../../src/lib/session/contracts'
import type { TelemetryService } from '../telemetry/telemetry-service'

const KILOMETERS_TO_MILES = 0.621371
const LITERS_TO_GALLONS = 0.264172

interface TrackingContext {
  lastFrame: NormalizedTelemetryFrame | null
  activeSession: SessionRecord | null
  activeTrip: TripRecord | null
  activeTruck: TruckRecord | null
  recentFuelEvent: FuelEventRecord | null
  latestTelemetryEvent: NormalizedTelemetryEvent | null
  inferredTrip: boolean
  pendingTripClosureFrames: number
  dismissedPromptTruckId: string | null
  lastDecisionNote: string | null
}

export class SessionTrackingService {
  private readonly telemetryService: TelemetryService
  private readonly repositories: FleetOpsRepositories
  private readonly stateListeners = new Set<
    (snapshot: SessionTrackingSnapshot) => void
  >()
  private readonly context: TrackingContext = {
    lastFrame: null,
    activeSession: null,
    activeTrip: null,
    activeTruck: null,
    recentFuelEvent: null,
    latestTelemetryEvent: null,
    inferredTrip: false,
    pendingTripClosureFrames: 0,
    dismissedPromptTruckId: null,
    lastDecisionNote: null,
  }
  private unsubscribeFrame: (() => void) | null = null
  private unsubscribeEvent: (() => void) | null = null
  private unsubscribeTelemetryState: (() => void) | null = null

  public constructor(
    telemetryService: TelemetryService,
    repositories: FleetOpsRepositories,
  ) {
    this.telemetryService = telemetryService
    this.repositories = repositories
  }

  public async initialize(): Promise<void> {
    this.context.activeSession = this.repositories.sessionRecords.findActive()
    this.context.activeTruck = this.context.activeSession?.truckId
      ? this.repositories.trucks.get(this.context.activeSession.truckId)
      : null
    this.context.activeTrip = this.context.activeSession?.tripId
      ? this.repositories.trips.get(this.context.activeSession.tripId)
      : null

    this.unsubscribeFrame = this.telemetryService.subscribeFrame((frame) => {
      void this.handleFrame(frame)
    })
    this.unsubscribeEvent = this.telemetryService.subscribeEvent((event) => {
      void this.handleEvent(event)
    })
    this.unsubscribeTelemetryState = this.telemetryService.subscribeState(() => {
      this.emitState()
    })
    this.emitState()
  }

  public getSnapshot(): SessionTrackingSnapshot {
    const telemetrySnapshot = this.telemetryService.getSnapshot()
    const activeTruck =
      this.context.activeTruck?.status === 'ignored' ? null : this.context.activeTruck
    const pendingPrompt =
      activeTruck &&
      activeTruck.status === 'pending' &&
      this.context.dismissedPromptTruckId !== activeTruck.id
        ? {
            truckId: activeTruck.id,
            displayName: activeTruck.displayName,
            detectedMake: activeTruck.detectedMake,
            detectedModel: activeTruck.detectedModel,
          }
        : null

    return {
      telemetryStatus: telemetrySnapshot.status,
      sessionState:
        this.context.activeSession?.status === 'active' ? 'tracking' : 'idle',
      activeSession: this.context.activeSession,
      activeTrip: this.context.activeTrip,
      activeTruck,
      latestFrame: this.context.lastFrame,
      latestTelemetryEvent: this.context.latestTelemetryEvent,
      recentFuelEvent: this.context.recentFuelEvent,
      newTruckPrompt: pendingPrompt,
      inferredTrip: this.context.inferredTrip,
      lastDecisionNote: this.context.lastDecisionNote,
    }
  }

  public subscribeState(
    callback: (snapshot: SessionTrackingSnapshot) => void,
  ): () => void {
    this.stateListeners.add(callback)
    callback(this.getSnapshot())
    return () => {
      this.stateListeners.delete(callback)
    }
  }

  public async registerPendingTruck(truckId: string): Promise<SessionTrackingSnapshot> {
    return this.registerPendingTruckWithDetails({
      truckId,
      displayName: '',
      detectedMake: null,
      detectedModel: null,
      startingOdometerMi: null,
      notes: null,
    })
  }

  public async registerPendingTruckWithDetails(
    input: RegisterDetectedTruckInput,
  ): Promise<SessionTrackingSnapshot> {
    const truck = this.repositories.trucks.get(input.truckId)
    if (!truck || truck.status !== 'pending') {
      return this.getSnapshot()
    }

    const displayName =
      input.displayName.trim() ||
      (truck.detectedMake && truck.detectedModel
        ? `${truck.detectedMake} ${truck.detectedModel}`
        : truck.displayName)

    this.context.activeTruck = this.repositories.trucks.update(input.truckId, {
      id: truck.id,
      displayName,
      detectedMake: input.detectedMake ?? truck.detectedMake,
      detectedModel: input.detectedModel ?? truck.detectedModel,
      detectedConfigHash: truck.detectedConfigHash,
      vinHash: truck.vinHash,
      firstSeenAt: truck.firstSeenAt,
      lastSeenAt: truck.lastSeenAt,
      startingOdometerMi: input.startingOdometerMi ?? truck.startingOdometerMi,
      currentOdometerMi: truck.currentOdometerMi,
      engineHours: truck.engineHours,
      idleHours: truck.idleHours,
      fuelUsedGal: truck.fuelUsedGal,
      status: 'active',
      notes: input.notes ?? truck.notes,
    })
    this.context.dismissedPromptTruckId = input.truckId
    this.context.lastDecisionNote = 'New truck registered.'
    this.emitState()
    return this.getSnapshot()
  }

  public async updateTruckDetails(input: {
    truckId: string
    displayName: string
    detectedMake: string | null
    detectedModel: string | null
    startingOdometerMi: number | null
    currentOdometerMi: number | null
    notes: string | null
    status: TruckRecord['status']
  }): Promise<SessionTrackingSnapshot> {
    const truck = this.repositories.trucks.get(input.truckId)
    if (!truck) {
      return this.getSnapshot()
    }

    const updatedTruck = this.repositories.trucks.update(input.truckId, {
      id: truck.id,
      displayName: input.displayName.trim() || truck.displayName,
      detectedMake: input.detectedMake ?? truck.detectedMake,
      detectedModel: input.detectedModel ?? truck.detectedModel,
      detectedConfigHash: truck.detectedConfigHash,
      vinHash: truck.vinHash,
      firstSeenAt: truck.firstSeenAt,
      lastSeenAt: truck.lastSeenAt,
      startingOdometerMi: input.startingOdometerMi,
      currentOdometerMi: input.currentOdometerMi,
      engineHours: truck.engineHours,
      idleHours: truck.idleHours,
      fuelUsedGal: truck.fuelUsedGal,
      status: input.status,
      notes: input.notes,
    })

    if (this.context.activeTruck?.id === input.truckId) {
      this.context.activeTruck = updatedTruck
    }
    this.context.lastDecisionNote = 'Truck details updated.'
    this.emitState()
    return this.getSnapshot()
  }

  public async ignorePendingTruck(truckId: string): Promise<SessionTrackingSnapshot> {
    const truck = this.repositories.trucks.get(truckId)
    if (!truck || truck.status !== 'pending') {
      return this.getSnapshot()
    }

    const updated = this.repositories.trucks.update(truckId, {
      id: truck.id,
      displayName: truck.displayName,
      detectedMake: truck.detectedMake,
      detectedModel: truck.detectedModel,
      detectedConfigHash: truck.detectedConfigHash,
      vinHash: truck.vinHash,
      firstSeenAt: truck.firstSeenAt,
      lastSeenAt: truck.lastSeenAt,
      startingOdometerMi: truck.startingOdometerMi,
      currentOdometerMi: truck.currentOdometerMi,
      engineHours: truck.engineHours,
      idleHours: truck.idleHours,
      fuelUsedGal: truck.fuelUsedGal,
      status: 'ignored',
      notes: appendNote(truck.notes, 'Ignored by operator.'),
    })
    this.context.activeTruck = updated
    this.context.dismissedPromptTruckId = truckId
    this.context.lastDecisionNote = 'Detected truck ignored.'
    this.emitState()
    return this.getSnapshot()
  }

  public async deferPendingTruck(truckId: string): Promise<SessionTrackingSnapshot> {
    this.context.dismissedPromptTruckId = truckId
    this.context.lastDecisionNote = 'Detected truck deferred for later.'
    this.emitState()
    return this.getSnapshot()
  }

  public async dispose(): Promise<void> {
    this.unsubscribeFrame?.()
    this.unsubscribeEvent?.()
    this.unsubscribeTelemetryState?.()
    this.stateListeners.clear()
  }

  private async handleEvent(event: NormalizedTelemetryEvent): Promise<void> {
    this.context.latestTelemetryEvent = event

    if (event.type === 'job.delivered' && this.context.activeTrip) {
      await this.closeTrip('telemetry', false)
    }

    if (event.type === 'provider.disconnected' && this.context.activeSession) {
      await this.closeSession('completed', 'Telemetry disconnected.')
    }

    this.emitState()
  }

  private async handleFrame(frame: NormalizedTelemetryFrame): Promise<void> {
    const previousFrame = this.context.lastFrame
    this.context.lastFrame = frame

    if (!this.context.activeSession && hasDrivingActivity(frame)) {
      this.context.activeSession = this.repositories.sessionRecords.create({
        truckId: null,
        tripId: null,
        startedAt: frame.timestamp,
        endedAt: null,
        status: 'active',
        source: 'telemetry',
        inferred: false,
        distanceMi: 0,
        fuelUsedGal: 0,
        idleMinutes: 0,
        lastFrameAt: frame.timestamp,
        notes: null,
      })
    }

    const truck = this.resolveTrackedTruck(frame)
    if (truck) {
      this.context.activeTruck = truck
      this.context.dismissedPromptTruckId =
        truck.status === 'pending' ? this.context.dismissedPromptTruckId : null
    }

    const distanceDeltaMi = calculateDistanceDeltaMi(previousFrame, frame)
    const fuelDelta = calculateFuelDelta(previousFrame, frame)
    const idleMinutesDelta = calculateIdleMinutes(previousFrame, frame)

    if (this.context.activeTruck) {
      this.context.activeTruck = this.updateTruckFromFrame(
        this.context.activeTruck,
        previousFrame,
        frame,
        fuelDelta.consumedGallons,
        idleMinutesDelta,
      )
    }

    if (this.context.activeSession) {
      this.context.activeSession = this.updateSessionFromFrame(
        this.context.activeSession,
        frame,
        this.context.activeTruck?.id ?? null,
        distanceDeltaMi,
        fuelDelta.consumedGallons,
        idleMinutesDelta,
      )
    }

    if (fuelDelta.refuelGallons > 0 && this.context.activeTruck) {
      this.context.recentFuelEvent = this.repositories.fuelEvents.create({
        tripId: this.context.activeTrip?.id ?? null,
        truckId: this.context.activeTruck.id,
        occurredAt: frame.timestamp,
        gallons: fuelDelta.refuelGallons,
        estimatedCostCents: null,
        locationLabel: frame.originCity ?? null,
        source: 'telemetry',
        notes: 'Detected from fuel increase in telemetry.',
      })
    }

    if (frame.jobActive && this.context.activeTruck && !this.context.activeTrip) {
      const existingActiveTrip = this.repositories.trips.findActiveByTruckId(
        this.context.activeTruck.id,
      )
      this.context.inferredTrip = true
      this.context.activeTrip =
        existingActiveTrip ??
        this.repositories.trips.create({
          truckId: this.context.activeTruck.id,
          garageId: null,
          startedAt: frame.timestamp,
          endedAt: null,
          originCity: frame.originCity,
          destinationCity: frame.destinationCity,
          cargoName: frame.cargoName,
          revenueCents: frame.income,
          distanceMi: 0,
          fuelUsedGal: 0,
          avgMpg: null,
          idleMinutes: 0,
          damageStart: frame.damageTruck,
          damageEnd: frame.damageTruck,
          status: 'active',
          notes: 'Started from active job telemetry.',
        })

      if (this.context.activeSession) {
        this.context.activeSession = this.repositories.sessionRecords.update(
          this.context.activeSession.id,
          {
            id: this.context.activeSession.id,
            truckId: this.context.activeSession.truckId,
            tripId: this.context.activeTrip.id,
            startedAt: this.context.activeSession.startedAt,
            endedAt: this.context.activeSession.endedAt,
            status: this.context.activeSession.status,
            source: this.context.activeSession.source,
            inferred: this.context.activeSession.inferred,
            distanceMi: this.context.activeSession.distanceMi,
            fuelUsedGal: this.context.activeSession.fuelUsedGal,
            idleMinutes: this.context.activeSession.idleMinutes,
            lastFrameAt: this.context.activeSession.lastFrameAt,
            notes: this.context.activeSession.notes,
          },
        )
      }
    }

    if (this.context.activeTrip?.status === 'active') {
      this.context.activeTrip = this.updateTripFromFrame(
        this.context.activeTrip,
        frame,
        distanceDeltaMi,
        fuelDelta.consumedGallons,
        idleMinutesDelta,
      )

      if (!frame.jobActive) {
        this.context.pendingTripClosureFrames += 1
      } else {
        this.context.pendingTripClosureFrames = 0
      }

      if (this.context.pendingTripClosureFrames >= 3) {
        await this.closeTrip('inferred', true)
      }
    }

    this.emitState()
  }

  private resolveTrackedTruck(frame: NormalizedTelemetryFrame): TruckRecord | null {
    const found = this.repositories.trucks.findByTelemetrySignature({
      detectedMake: frame.truckMake,
      detectedModel: frame.truckModel,
      detectedConfigHash: buildTruckFingerprint(frame),
    })

    if (found) {
      return found
    }

    if (!frame.truckMake && !frame.truckModel && !frame.truckConfigHash) {
      return null
    }

    const displayName = frame.truckMake && frame.truckModel
      ? `Detected ${frame.truckMake} ${frame.truckModel}`
      : 'Detected truck'

    return this.repositories.trucks.create({
      displayName,
      detectedMake: frame.truckMake,
      detectedModel: frame.truckModel,
      detectedConfigHash: buildTruckFingerprint(frame),
      vinHash: null,
      firstSeenAt: frame.timestamp,
      lastSeenAt: frame.timestamp,
      startingOdometerMi:
        frame.odometerKm != null ? frame.odometerKm * KILOMETERS_TO_MILES : null,
      currentOdometerMi:
        frame.odometerKm != null ? frame.odometerKm * KILOMETERS_TO_MILES : null,
      engineHours: null,
      idleHours: 0,
      fuelUsedGal: 0,
      status: 'pending',
      notes: 'Created from live telemetry fingerprint.',
    })
  }

  private updateTruckFromFrame(
    truck: TruckRecord,
    previousFrame: NormalizedTelemetryFrame | null,
    frame: NormalizedTelemetryFrame,
    fuelConsumedGallons: number,
    idleMinutesDelta: number,
  ): TruckRecord {
    return this.repositories.trucks.update(truck.id, {
      id: truck.id,
      displayName: truck.displayName,
      detectedMake: truck.detectedMake,
      detectedModel: truck.detectedModel,
      detectedConfigHash: truck.detectedConfigHash,
      vinHash: truck.vinHash,
      firstSeenAt: truck.firstSeenAt,
      lastSeenAt: frame.timestamp,
      startingOdometerMi: truck.startingOdometerMi,
      currentOdometerMi:
        frame.odometerKm != null ? frame.odometerKm * KILOMETERS_TO_MILES : truck.currentOdometerMi,
      engineHours:
        truck.engineHours != null
          ? truck.engineHours + frameDeltaHours(previousFrame, frame)
          : frameDeltaHours(previousFrame, frame),
      idleHours: (truck.idleHours ?? 0) + idleMinutesDelta / 60,
      fuelUsedGal: (truck.fuelUsedGal ?? 0) + fuelConsumedGallons,
      status:
        truck.status === 'ignored'
          ? 'ignored'
          : frame.speedKph != null && frame.speedKph > 1
            ? 'active'
            : truck.status,
      notes: truck.notes,
    })!
  }

  private updateSessionFromFrame(
    session: SessionRecord,
    frame: NormalizedTelemetryFrame,
    truckId: string | null,
    distanceDeltaMi: number,
    fuelConsumedGallons: number,
    idleMinutesDelta: number,
  ): SessionRecord {
    return this.repositories.sessionRecords.update(session.id, {
      id: session.id,
      truckId,
      tripId: this.context.activeTrip?.id ?? session.tripId,
      startedAt: session.startedAt,
      endedAt: session.endedAt,
      status: session.status,
      source: session.source,
      inferred: session.inferred,
      distanceMi: session.distanceMi + distanceDeltaMi,
      fuelUsedGal: session.fuelUsedGal + fuelConsumedGallons,
      idleMinutes: session.idleMinutes + idleMinutesDelta,
      lastFrameAt: frame.timestamp,
      notes: session.notes,
    })!
  }

  private updateTripFromFrame(
    trip: TripRecord,
    frame: NormalizedTelemetryFrame,
    distanceDeltaMi: number,
    fuelConsumedGallons: number,
    idleMinutesDelta: number,
  ): TripRecord {
    const nextDistanceMi = trip.distanceMi + distanceDeltaMi
    const nextFuelUsedGal = trip.fuelUsedGal + fuelConsumedGallons
    const nextAvgMpg =
      nextDistanceMi > 0 && nextFuelUsedGal > 0
        ? nextDistanceMi / nextFuelUsedGal
        : trip.avgMpg

    return this.repositories.trips.update(trip.id, {
      id: trip.id,
      truckId: trip.truckId,
      garageId: trip.garageId,
      startedAt: trip.startedAt,
      endedAt: trip.endedAt,
      originCity: frame.originCity ?? trip.originCity,
      destinationCity: frame.destinationCity ?? trip.destinationCity,
      cargoName: frame.cargoName ?? trip.cargoName,
      revenueCents: frame.income ?? trip.revenueCents,
      distanceMi: nextDistanceMi,
      fuelUsedGal: nextFuelUsedGal,
      avgMpg: nextAvgMpg ?? null,
      idleMinutes: trip.idleMinutes + idleMinutesDelta,
      damageStart: trip.damageStart,
      damageEnd: frame.damageTruck ?? trip.damageEnd,
      status: 'active',
      notes: trip.notes,
    })!
  }

  private async closeTrip(
    source: 'telemetry' | 'inferred',
    inferred: boolean,
  ): Promise<void> {
    if (!this.context.activeTrip) {
      return
    }

    const trip = this.context.activeTrip
    const frame = this.context.lastFrame
    const closedTrip = this.repositories.trips.update(trip.id, {
      id: trip.id,
      truckId: trip.truckId,
      garageId: trip.garageId,
      startedAt: trip.startedAt,
      endedAt: frame?.timestamp ?? trip.endedAt ?? trip.updatedAt,
      originCity: trip.originCity,
      destinationCity: frame?.destinationCity ?? trip.destinationCity,
      cargoName: trip.cargoName,
      revenueCents: frame?.income ?? trip.revenueCents,
      distanceMi: trip.distanceMi,
      fuelUsedGal: trip.fuelUsedGal,
      avgMpg: trip.avgMpg,
      idleMinutes: trip.idleMinutes,
      damageStart: trip.damageStart,
      damageEnd: frame?.damageTruck ?? trip.damageEnd,
      status: 'completed',
      notes:
        source === 'inferred'
          ? appendNote(trip.notes, 'Closed from conservative telemetry heuristics.')
          : trip.notes,
    })

    if (closedTrip?.revenueCents != null) {
      const financeEntry: NewFinanceEntryRecord = {
        tripId: closedTrip.id,
        truckId: closedTrip.truckId,
        garageId: closedTrip.garageId,
        occurredAt: closedTrip.endedAt ?? closedTrip.updatedAt,
        category: 'trip_revenue',
        amountCents: closedTrip.revenueCents,
        description: closedTrip.cargoName
          ? `Trip revenue: ${closedTrip.cargoName}`
          : 'Trip revenue',
        source,
      }
      this.repositories.financeEntries.create(financeEntry)
    }

    this.context.activeTrip = null
    this.context.inferredTrip = inferred
    this.context.pendingTripClosureFrames = 0

    if (this.context.activeSession) {
      this.context.activeSession = this.repositories.sessionRecords.update(
        this.context.activeSession.id,
        {
          id: this.context.activeSession.id,
          truckId: this.context.activeSession.truckId,
          tripId: closedTrip?.id ?? this.context.activeSession.tripId,
          startedAt: this.context.activeSession.startedAt,
          endedAt: this.context.activeSession.endedAt,
          status: this.context.activeSession.status,
          source: inferred ? 'inferred' : this.context.activeSession.source,
          inferred,
          distanceMi: this.context.activeSession.distanceMi,
          fuelUsedGal: this.context.activeSession.fuelUsedGal,
          idleMinutes: this.context.activeSession.idleMinutes,
          lastFrameAt:
            this.context.lastFrame?.timestamp ?? this.context.activeSession.lastFrameAt,
          notes: inferred
            ? appendNote(
                this.context.activeSession.notes,
                'Trip closed from telemetry heuristics.',
              )
            : this.context.activeSession.notes,
        },
      )
    }
  }

  private async closeSession(
    status: SessionRecord['status'],
    note: string,
  ): Promise<void> {
    if (!this.context.activeSession) {
      return
    }

    this.context.activeSession = this.repositories.sessionRecords.update(
      this.context.activeSession.id,
      {
        id: this.context.activeSession.id,
        truckId: this.context.activeSession.truckId,
        tripId: this.context.activeSession.tripId,
        startedAt: this.context.activeSession.startedAt,
        endedAt: this.context.lastFrame?.timestamp ?? this.context.activeSession.lastFrameAt,
        status,
        source: this.context.activeSession.source,
        inferred: this.context.activeSession.inferred,
        distanceMi: this.context.activeSession.distanceMi,
        fuelUsedGal: this.context.activeSession.fuelUsedGal,
        idleMinutes: this.context.activeSession.idleMinutes,
        lastFrameAt: this.context.activeSession.lastFrameAt,
        notes: appendNote(this.context.activeSession.notes, note),
      },
    )
  }

  private emitState(): void {
    const snapshot = this.getSnapshot()
    for (const listener of this.stateListeners) {
      listener(snapshot)
    }
  }
}

function hasDrivingActivity(frame: NormalizedTelemetryFrame): boolean {
  return (frame.speedKph ?? 0) > 1 || frame.jobActive === true || frame.engineOn === true
}

function calculateDistanceDeltaMi(
  previousFrame: NormalizedTelemetryFrame | null,
  frame: NormalizedTelemetryFrame,
): number {
  if (previousFrame?.odometerKm == null || frame.odometerKm == null) {
    return 0
  }

  const deltaKm = frame.odometerKm - previousFrame.odometerKm
  if (deltaKm <= 0 || deltaKm > 5) {
    return 0
  }

  return deltaKm * KILOMETERS_TO_MILES
}

function calculateFuelDelta(
  previousFrame: NormalizedTelemetryFrame | null,
  frame: NormalizedTelemetryFrame,
): { consumedGallons: number; refuelGallons: number } {
  if (previousFrame?.fuelLiters == null || frame.fuelLiters == null) {
    return { consumedGallons: 0, refuelGallons: 0 }
  }

  const deltaLiters = frame.fuelLiters - previousFrame.fuelLiters

  if (deltaLiters > 8) {
    return {
      consumedGallons: 0,
      refuelGallons: deltaLiters * LITERS_TO_GALLONS,
    }
  }

  if (deltaLiters < 0 && Math.abs(deltaLiters) < 8) {
    return {
      consumedGallons: Math.abs(deltaLiters) * LITERS_TO_GALLONS,
      refuelGallons: 0,
    }
  }

  return { consumedGallons: 0, refuelGallons: 0 }
}

function calculateIdleMinutes(
  previousFrame: NormalizedTelemetryFrame | null,
  frame: NormalizedTelemetryFrame,
): number {
  if (!previousFrame || !frame.engineOn || (frame.speedKph ?? 0) > 1) {
    return 0
  }

  const previousTime = new Date(previousFrame.timestamp).getTime()
  const currentTime = new Date(frame.timestamp).getTime()
  const deltaMinutes = (currentTime - previousTime) / 60000

  if (deltaMinutes <= 0 || deltaMinutes > 2) {
    return 0
  }

  return deltaMinutes
}

function frameDeltaHours(
  previousFrame: NormalizedTelemetryFrame | null,
  frame: NormalizedTelemetryFrame,
): number {
  if (!previousFrame || !frame.engineOn) {
    return 0
  }

  const previousTime = new Date(previousFrame.timestamp).getTime()
  const currentTime = new Date(frame.timestamp).getTime()
  const deltaHours = (currentTime - previousTime) / 3600000

  if (deltaHours <= 0 || deltaHours > 0.1) {
    return 0
  }

  return deltaHours
}

function buildTruckFingerprint(frame: NormalizedTelemetryFrame): string | null {
  const parts = [
    frame.game,
    frame.truckId,
    frame.truckConfigHash,
    frame.truckMake,
    frame.truckModel,
  ].filter(Boolean)

  return parts.length > 0 ? parts.join('|') : null
}

function appendNote(current: string | null, note: string): string {
  return current ? `${current}\n${note}` : note
}
