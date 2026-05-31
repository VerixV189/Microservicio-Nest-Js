# API Endpoints (GraphQL)

Estos endpoints corresponden a las operaciones disponibles en el módulo de `documents`.

1. Crear documento (subir archivo)

- URL: `POST http://localhost:3000/graphql`
- Auth: `Authorization: Bearer <JWT>` (si el guard está activo)
- Content-Type: multipart/form-data (usar `operations` + `map`)
- GraphQL (operations):

```json
{
  "query": "mutation SubirDocumento($file: Upload!, $usuarioId: String!) { subirDocumento(file: $file, usuarioId: $usuarioId) { id nombre_original s3_key mime_type estado creado_por } }",
  "variables": { "file": null, "usuarioId": "<UUID_USUARIO>" }
}
```

- GraphQL (map):

```json
{ "0": ["variables.file"] }
```

- Form field `0`: archivo a subir.

2. Descargar documento (obtener link pre-firmado)

- URL: `POST http://localhost:3000/graphql`
- Auth: `Authorization: Bearer <JWT>` (si el guard está activo)
- Content-Type: application/json
- Body:

```json
{
  "query": "query ObtenerLinkDocumento($documentoId: String!, $usuarioId: String!) { obtenerLinkDocumento(documentoId: $documentoId, usuarioId: $usuarioId) }",
  "variables": {
    "documentoId": "<UUID_DOCUMENTO>",
    "usuarioId": "<UUID_USUARIO>"
  }
}
```

3. Eliminar documento (soft delete)

- URL: `POST http://localhost:3000/graphql`
- Auth: `Authorization: Bearer <JWT>` (si el guard está activo)
- Content-Type: application/json
- Body:

```json
{
  "query": "mutation EliminarDocumento($documentoId: String!, $usuarioId: String!) { eliminarDocumento(documentoId: $documentoId, usuarioId: $usuarioId) }",
  "variables": {
    "documentoId": "<UUID_DOCUMENTO>",
    "usuarioId": "<UUID_USUARIO>"
  }
}
```

4. Listar logs de auditoría

- URL: `POST http://localhost:3000/graphql`
- Auth: (opcional) `Authorization: Bearer <JWT>` según configuración
- Content-Type: application/json
- Body:

```json
{
  "query": "query ListarAuditoria($documentoId: String!) { listarAuditoria(documentoId: $documentoId) { id accion detalles usuario_id created_at updated_at deleted_at } }",
  "variables": { "documentoId": "<UUID_DOCUMENTO>" }
}
```

5. Listar logs globales recientes (panel de administrador)
- URL: `POST http://localhost:3000/graphql`
- Auth: `Authorization: Bearer <JWT>` si lo quieres proteger por rol o token
- Content-Type: application/json
- Body:
```json
{
  "query": "query ListarAuditoriaGlobal($limite: Int) { listarAuditoriaGlobal(limite: $limite) { id accion detalles usuario_id created_at updated_at deleted_at documento { id nombre_original estado s3_key } } }",
  "variables": { "limite": 50 }
}
```

Notas:

- No añadir manualmente `Content-Type` cuando uses `form-data` en Postman (Postman lo establecerá con boundary).
- Reemplaza `<JWT>`, `<UUID_USUARIO>` y `<UUID_DOCUMENTO>` por los valores reales.
- Si quieres, puedo añadir ejemplos `curl` o colecciones de Postman exportables.
