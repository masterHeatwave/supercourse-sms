// export const fileOpenApi = {
//     tags: [
//         {
//             name: 'Files',
//             description: 'Files management operations',
//         },
//     ],
//     paths: {
//         '/Files': {
//             get: {
//                 tags: ['Files'],
//                 summary: 'Get all files',
//                 description: 'Retrieve a list of all files with optional filtering and pagination',
//                 security: [{ AuthHeader: [], CustomerSlug: [] }],
//                 parameters: [
//                     {
//                         name: 'limit',
//                         in: 'query',
//                         description: 'Number of files to return',
//                         schema: {
//                             type: 'integer',
//                             default: 10,
//                         },
//                     },
//                     {
//                         name: 'skip',
//                         in: 'query',
//                         description: 'Number of files to skip for pagination',
//                         schema: {
//                             type: 'integer',
//                             default: 0,
//                         },
//                     },
//                     {
//                         name: 'type',
//                         in: 'query',
//                         description: 'Filter by file type',
//                         schema: {
//                             type: 'string',
//                             enum: ['file', 'folder'],
//                         },
//                     },
//                     {
//                         name: 'ownerId',
//                         in: 'query',
//                         description: 'Filter by owner ID',
//                         schema: {
//                             type: 'string',
//                             pattern: '^[0-9a-fA-F]{24}$',
//                         },
//                     },
//                 ],
//                 responses: {
//                     '200': {
//                         description: 'Successfully retrieved files',
//                         content: {
//                             'application/json': {
//                                 schema: {
//                                     type: 'object',
//                                     properties: {
//                                         success: {
//                                             type: 'boolean',
//                                         },
//                                         data: {
//                                             type: 'array',
//                                             items: {
//                                                 $ref: '#/components/schemas/File',
//                                             },
//                                         },
//                                         total: {
//                                             type: 'integer',
//                                         },
//                                         limit: {
//                                             type: 'integer',
//                                         },
//                                         skip: {
//                                             type: 'integer',
//                                         },
//                                     },
//                                 },
//                             },
//                         },
//                     },
//                     '400': {
//                         description: 'Bad request',
//                         content: {
//                             'application/json': {
//                                 schema: {
//                                     $ref: '#/components/schemas/Error',
//                                 },
//                             },
//                         },
//                     },
//                     '500': {
//                         description: 'Internal server error',
//                         content: {
//                             'application/json': {
//                                 schema: {
//                                     $ref: '#/components/schemas/Error',
//                                 },
//                             },
//                         },
//                     },
//                 },
//             },
//             post: {
//                 tags: ['Files'],
//                 summary: 'Create a new file',
//                 description: 'Create a new file with required fields from FileCreateSchema',
//                 security: [{ AuthHeader: [], CustomerSlug: [] }],
//                 requestBody: {
//                     required: true,
//                     content: {
//                         'application/json': {
//                             schema: {
//                                 $ref: '#/components/schemas/FileCreate',
//                             },
//                         },
//                     },
//                 },
//                 responses: {
//                     '201': {
//                         description: 'File created successfully',
//                         content: {
//                             'application/json': {
//                                 schema: {
//                                     type: 'object',
//                                     properties: {
//                                         success: {
//                                             type: 'boolean',
//                                         },
//                                         data: {
//                                             $ref: '#/components/schemas/File',
//                                         },
//                                     },
//                                 },
//                             },
//                         },
//                     },
//                     '400': {
//                         description: 'Validation error',
//                         content: {
//                             'application/json': {
//                                 schema: {
//                                     $ref: '#/components/schemas/Error',
//                                 },
//                             },
//                         },
//                     },
//                     '500': {
//                         description: 'Internal server error',
//                         content: {
//                             'application/json': {
//                                 schema: {
//                                     $ref: '#/components/schemas/Error',
//                                 },
//                             },
//                         },
//                     },
//                 },
//             },
//         },
//         '/files/{id}': {
//             get: {
//                 tags: ['Files'],
//                 summary: 'Get a single file by ID',
//                 description: 'Retrieve a specific file by its MongoDB ObjectId',
//                 security: [{ AuthHeader: [], CustomerSlug: [] }],
//                 parameters: [
//                     {
//                         name: 'id',
//                         in: 'path',
//                         required: true,
//                         description: 'File ID (MongoDB ObjectId)',
//                         schema: {
//                             type: 'string',
//                             pattern: '^[0-9a-fA-F]{24}$',
//                         },
//                     },
//                 ],
//                 responses: {
//                     '200': {
//                         description: 'Successfully retrieved file',
//                         content: {
//                             'application/json': {
//                                 schema: {
//                                     type: 'object',
//                                     properties: {
//                                         success: {
//                                             type: 'boolean',
//                                         },
//                                         data: {
//                                             $ref: '#/components/schemas/File',
//                                         },
//                                     },
//                                 },
//                             },
//                         },
//                     },
//                     '404': {
//                         description: 'File not found',
//                         content: {
//                             'application/json': {
//                                 schema: {
//                                     $ref: '#/components/schemas/Error',
//                                 },
//                             },
//                         },
//                     },
//                     '500': {
//                         description: 'Internal server error',
//                         content: {
//                             'application/json': {
//                                 schema: {
//                                     $ref: '#/components/schemas/Error',
//                                 },
//                             },
//                         },
//                     },
//                 },
//             },
//             put: {
//                 tags: ['Files'],
//                 summary: 'Update a file',
//                 description: 'Update an existing file with optional fields from FileUpdateSchema',
//                 security: [{ AuthHeader: [], CustomerSlug: [] }],
//                 parameters: [
//                     {
//                         name: 'id',
//                         in: 'path',
//                         required: true,
//                         description: 'File ID (MongoDB ObjectId)',
//                         schema: {
//                             type: 'string',
//                             pattern: '^[0-9a-fA-F]{24}$',
//                         },
//                     },
//                 ],
//                 requestBody: {
//                     required: true,
//                     content: {
//                         'application/json': {
//                             schema: {
//                                 $ref: '#/components/schemas/FileUpdate',
//                             },
//                         },
//                     },
//                 },
//                 responses: {
//                     '200': {
//                         description: 'File updated successfully',
//                         content: {
//                             'application/json': {
//                                 schema: {
//                                     type: 'object',
//                                     properties: {
//                                         success: {
//                                             type: 'boolean',
//                                         },
//                                         data: {
//                                             $ref: '#/components/schemas/File',
//                                         },
//                                     },
//                                 },
//                             },
//                         },
//                     },
//                     '400': {
//                         description: 'Validation error',
//                         content: {
//                             'application/json': {
//                                 schema: {
//                                     $ref: '#/components/schemas/Error',
//                                 },
//                             },
//                         },
//                     },
//                     '404': {
//                         description: 'File not found',
//                         content: {
//                             'application/json': {
//                                 schema: {
//                                     $ref: '#/components/schemas/Error',
//                                 },
//                             },
//                         },
//                     },
//                     '500': {
//                         description: 'Internal server error',
//                         content: {
//                             'application/json': {
//                                 schema: {
//                                     $ref: '#/components/schemas/Error',
//                                 },
//                             },
//                         },
//                     },
//                 },
//             },
//             delete: {
//                 tags: ['Files'],
//                 summary: 'Delete a file',
//                 description: 'Delete a file by its MongoDB ObjectId',
//                 security: [{ AuthHeader: [], CustomerSlug: [] }],
//                 parameters: [
//                     {
//                         name: 'id',
//                         in: 'path',
//                         required: true,
//                         description: 'File ID (MongoDB ObjectId)',
//                         schema: {
//                             type: 'string',
//                             pattern: '^[0-9a-fA-F]{24}$',
//                         },
//                     },
//                 ],
//                 responses: {
//                     '200': {
//                         description: 'File deleted successfully',
//                         content: {
//                             'application/json': {
//                                 schema: {
//                                     type: 'object',
//                                     properties: {
//                                         success: {
//                                             type: 'boolean',
//                                         },
//                                         message: {
//                                             type: 'string',
//                                         },
//                                     },
//                                 },
//                             },
//                         },
//                     },
//                     '404': {
//                         description: 'File not found',
//                         content: {
//                             'application/json': {
//                                 schema: {
//                                     $ref: '#/components/schemas/Error',
//                                 },
//                             },
//                         },
//                     },
//                     '500': {
//                         description: 'Internal server error',
//                         content: {
//                             'application/json': {
//                                 schema: {
//                                     $ref: '#/components/schemas/Error',
//                                 },
//                             },
//                         },
//                     },
//                 },
//             },
//         },
//     },
    
// };