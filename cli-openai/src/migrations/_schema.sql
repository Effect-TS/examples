CREATE TABLE IF NOT EXISTS "sqlfx_migrations" (
        migration_id integer PRIMARY KEY NOT NULL,
        created_at datetime NOT NULL DEFAULT current_timestamp,
        name VARCHAR(255) NOT NULL
      );
CREATE TABLE document_chunks (
      id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
      path TEXT NOT NULL,
      title TEXT,
      subtitle TEXT,
      content TEXT NOT NULL,
      content_hash INTEGER NOT NULL,
      token_count INTEGER NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

CREATE UNIQUE INDEX document_chunks_content_hash_idx
    ON document_chunks (content_hash);
CREATE VIRTUAL TABLE vss_chunks
    USING vss0(embedding(1536));
CREATE TABLE IF NOT EXISTS "vss_chunks_index"(rowid integer primary key autoincrement, idx);
CREATE TABLE IF NOT EXISTS "vss_chunks_data"(rowid integer primary key autoincrement, _);

INSERT INTO sqlfx_migrations VALUES(1,'2024-02-22 07:42:38','create_document_chunks');
INSERT INTO sqlfx_migrations VALUES(2,'2024-02-22 07:42:38','document_chunk_unique_index');
INSERT INTO sqlfx_migrations VALUES(3,'2024-02-22 07:42:38','create_vss_chunks');