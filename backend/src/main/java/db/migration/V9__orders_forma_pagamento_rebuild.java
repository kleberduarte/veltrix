package db.migration;

import org.flywaydb.core.api.migration.BaseJavaMigration;
import org.flywaydb.core.api.migration.Context;

import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.Statement;

/**
 * Evita MODIFY direto ENUM/NULL → erro 1265: copia para coluna nova, normaliza e troca.
 */
public class V9__orders_forma_pagamento_rebuild extends BaseJavaMigration {

    @Override
    public boolean canExecuteInTransaction() {
        return false;
    }

    @Override
    public void migrate(Context context) throws Exception {
        Connection conn = context.getConnection();
        if (!columnExists(conn, "orders", "forma_pagamento")) {
            return;
        }
        try (Statement st = conn.createStatement()) {
            if (columnExists(conn, "orders", "_veltrix_fp")) {
                st.execute("ALTER TABLE orders DROP COLUMN _veltrix_fp");
            }
            st.execute("ALTER TABLE orders ADD COLUMN _veltrix_fp VARCHAR(20) NULL");
        }
        try (var ps = conn.prepareStatement(
                "UPDATE orders SET _veltrix_fp = COALESCE(NULLIF(TRIM(CAST(forma_pagamento AS CHAR)), ''), 'DINHEIRO')")) {
            ps.executeUpdate();
        }
        try (var ps = conn.prepareStatement(
                "UPDATE orders SET _veltrix_fp = 'DINHEIRO' WHERE _veltrix_fp NOT IN ('DINHEIRO','DEBITO','CARTAO','PIX')")) {
            ps.executeUpdate();
        }
        try (Statement st = conn.createStatement()) {
            st.execute("ALTER TABLE orders DROP COLUMN forma_pagamento");
            st.execute("ALTER TABLE orders CHANGE COLUMN _veltrix_fp forma_pagamento VARCHAR(20) NOT NULL DEFAULT 'DINHEIRO'");
        }
    }

    private static boolean columnExists(Connection conn, String table, String column) throws Exception {
        String catalog = conn.getCatalog();
        try (ResultSet rs = conn.getMetaData().getColumns(catalog, null, table, column)) {
            return rs.next();
        }
    }
}
