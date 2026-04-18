package db.migration;

import org.flywaydb.core.api.migration.BaseJavaMigration;
import org.flywaydb.core.api.migration.Context;

import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.Statement;

/**
 * Garante {@code orders.forma_pagamento} quando a V9 Java não criou a coluna (base só V1) e sem depender
 * de sintaxe {@code IF NOT EXISTS} (compatível com todos os modos Flyway/MySQL usados no projeto).
 */
public class V25__orders_forma_pagamento_ensure extends BaseJavaMigration {

    @Override
    public void migrate(Context context) throws Exception {
        Connection conn = context.getConnection();
        if (columnExists(conn, "orders", "forma_pagamento")) {
            return;
        }
        try (Statement st = conn.createStatement()) {
            st.execute(
                    "ALTER TABLE orders ADD COLUMN forma_pagamento VARCHAR(20) NOT NULL DEFAULT 'DINHEIRO'");
        }
    }

    private static boolean columnExists(Connection conn, String table, String column) throws Exception {
        String catalog = conn.getCatalog();
        try (ResultSet rs = conn.getMetaData().getColumns(catalog, null, table, column)) {
            return rs.next();
        }
    }
}
