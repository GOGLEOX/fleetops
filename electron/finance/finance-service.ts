import type { FleetOpsRepositories } from '../db/repositories'
import type {
  FinanceEntryRecord,
  NewFinanceEntryRecord,
} from '../../src/lib/persistence/contracts'
import type {
  FinanceEntryInput,
  FinanceSnapshot,
} from '../../src/lib/finance/contracts'

export class FinanceService {
  private readonly repositories: FleetOpsRepositories

  public constructor(repositories: FleetOpsRepositories) {
    this.repositories = repositories
  }

  public getSnapshot(): FinanceSnapshot {
    return {
      entries: this.repositories.financeEntries.list(),
      trips: this.repositories.trips.list(),
      trucks: this.repositories.trucks
        .list()
        .filter((truck) => truck.status !== 'ignored'),
      garages: this.repositories.garages.list(),
    }
  }

  public saveEntry(input: FinanceEntryInput): FinanceEntryRecord | null {
    const description = input.description.trim()
    if (!description) {
      return null
    }

    const normalized: NewFinanceEntryRecord = {
      tripId: input.tripId,
      truckId: input.truckId,
      garageId: input.garageId,
      occurredAt: input.occurredAt,
      category: input.category,
      amountCents: input.amountCents,
      description,
      source: 'manual',
    }

    if (input.entryId) {
      const existing = this.repositories.financeEntries.get(input.entryId)
      if (!existing || existing.source !== 'manual') {
        return null
      }

      return this.repositories.financeEntries.update(input.entryId, normalized)
    }

    return this.repositories.financeEntries.create(normalized)
  }

  public deleteEntry(entryId: string): boolean {
    const entry = this.repositories.financeEntries.get(entryId)
    if (!entry || entry.source !== 'manual') {
      return false
    }

    this.repositories.financeEntries.delete(entryId)
    return true
  }
}
