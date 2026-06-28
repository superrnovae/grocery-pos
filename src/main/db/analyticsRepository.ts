import type Database from 'better-sqlite3'
import type { DashboardStats, TopProduct } from '@shared/types'

export interface AnalyticsRepository {
  getDashboardStats(): DashboardStats
}

export function createAnalyticsRepository(db: Database.Database): AnalyticsRepository {
  const todayRevenueStmt = db.prepare(`
    SELECT COALESCE(SUM(total_cents), 0) AS revenue FROM sales WHERE date(created_at) = date('now')
  `)
  const yesterdayRevenueStmt = db.prepare(`
    SELECT COALESCE(SUM(total_cents), 0) AS revenue
    FROM sales
    WHERE date(created_at) = date('now', '-1 day')
  `)
  /** Groups by the snapshotted product name, not product_id, so a later-deleted product still counts. */
  const topProductsStmt = db.prepare(`
    SELECT product_name_snapshot AS name, SUM(quantity) AS quantity
    FROM sale_items
    GROUP BY product_name_snapshot
    ORDER BY quantity DESC
    LIMIT 5
  `)

  return {
    getDashboardStats(): DashboardStats {
      const todayRevenueCents = (todayRevenueStmt.get() as { revenue: number }).revenue
      const yesterdayRevenueCents = (yesterdayRevenueStmt.get() as { revenue: number }).revenue
      const topProducts = topProductsStmt.all() as TopProduct[]
      return { todayRevenueCents, yesterdayRevenueCents, topProducts }
    }
  }
}
