import { z } from "zod";

export const VaultConfigSchema = z.object({
  apiKey: z.string().min(1, "API key is required"),
  baseUrl: z.string().url("Base URL must be a valid URL"),
  name: z.string().min(1, "Vault name is required"),
  port: z.number().int().min(1).max(65535).optional().default(27123),
  isActive: z.boolean().optional().default(false),
  lastUsed: z.date().optional(),
});

export const VaultCollectionSchema = z.object({
  vaults: z.record(z.string(), VaultConfigSchema),
  defaultVault: z.string().optional(),
  activeVault: z.string().optional(),
});

export const ListVaultsParamsSchema = z.object({});

export const GetVaultInfoParamsSchema = z.object({
  vault: z.string().min(1, "Vault name is required"),
});

export const SetActiveVaultParamsSchema = z.object({
  vault: z.string().min(1, "Vault name is required"),
});

export const AddVaultParamsSchema = z.object({
  name: z.string().min(1, "Vault name is required"),
  apiKey: z.string().min(1, "API key is required"),
  baseUrl: z.string().url("Base URL must be a valid URL").optional(),
  displayName: z.string().optional(),
  setAsActive: z.boolean().optional().default(false),
});

export const RemoveVaultParamsSchema = z.object({
  vault: z.string().min(1, "Vault name is required"),
});

export type VaultConfig = z.infer<typeof VaultConfigSchema>;
export type VaultCollection = z.infer<typeof VaultCollectionSchema>;
export type ListVaultsParams = z.infer<typeof ListVaultsParamsSchema>;
export type GetVaultInfoParams = z.infer<typeof GetVaultInfoParamsSchema>;
export type SetActiveVaultParams = z.infer<typeof SetActiveVaultParamsSchema>;
export type AddVaultParams = z.infer<typeof AddVaultParamsSchema>;
export type RemoveVaultParams = z.infer<typeof RemoveVaultParamsSchema>;

export const VaultInfoResponseSchema = z.object({
  name: z.string(),
  displayName: z.string(),
  baseUrl: z.string(),
  isActive: z.boolean(),
  lastUsed: z.date().optional(),
  status: z.enum(["connected", "disconnected", "error"]),
});

export const VaultListResponseSchema = z.object({
  vaults: z.array(VaultInfoResponseSchema),
  activeVault: z.string().optional(),
  defaultVault: z.string().optional(),
});

export type VaultInfoResponse = z.infer<typeof VaultInfoResponseSchema>;
export type VaultListResponse = z.infer<typeof VaultListResponseSchema>;

export const GetActiveFileParamsSchema = z.object({
  vault: z.string().optional(),
});

export const AppendToActiveFileParamsSchema = z.object({
  content: z.string().min(1, "Content is required"),
  vault: z.string().optional(),
});

export const ReplaceActiveFileParamsSchema = z.object({
  content: z.string(),
  vault: z.string().optional(),
});

export const PatchActiveFileParamsSchema = z.object({
  insertions: z.array(z.object({
    line: z.number().int().min(0),
    content: z.string(),
  })).optional(),
  deletions: z.array(z.object({
    startLine: z.number().int().min(0),
    endLine: z.number().int().min(0),
  })).optional(),
  replacements: z.array(z.object({
    startLine: z.number().int().min(0),
    endLine: z.number().int().min(0),
    content: z.string(),
  })).optional(),
  vault: z.string().optional(),
});

export const DeleteActiveFileParamsSchema = z.object({
  vault: z.string().optional(),
});

export type GetActiveFileParams = z.infer<typeof GetActiveFileParamsSchema>;
export type AppendToActiveFileParams = z.infer<typeof AppendToActiveFileParamsSchema>;
export type ReplaceActiveFileParams = z.infer<typeof ReplaceActiveFileParamsSchema>;
export type PatchActiveFileParams = z.infer<typeof PatchActiveFileParamsSchema>;
export type DeleteActiveFileParams = z.infer<typeof DeleteActiveFileParamsSchema>;

// Vault File Operations Schemas
export const GetFileParamsSchema = z.object({
  path: z.string().min(1, "File path is required"),
  vault: z.string().optional(),
});

export const CreateFileParamsSchema = z.object({
  path: z.string().min(1, "File path is required"),
  content: z.string(),
  vault: z.string().optional(),
});

export const AppendToFileParamsSchema = z.object({
  path: z.string().min(1, "File path is required"),
  content: z.string().min(1, "Content is required"),
  vault: z.string().optional(),
});

export const ReplaceFileParamsSchema = z.object({
  path: z.string().min(1, "File path is required"),
  content: z.string(),
  vault: z.string().optional(),
});

export const PatchFileParamsSchema = z.object({
  path: z.string().min(1, "File path is required"),
  insertions: z.array(z.object({
    line: z.number().int().min(0),
    content: z.string(),
  })).optional(),
  deletions: z.array(z.object({
    startLine: z.number().int().min(0),
    endLine: z.number().int().min(0),
  })).optional(),
  replacements: z.array(z.object({
    startLine: z.number().int().min(0),
    endLine: z.number().int().min(0),
    content: z.string(),
  })).optional(),
  vault: z.string().optional(),
});

export const DeleteFileParamsSchema = z.object({
  path: z.string().min(1, "File path is required"),
  vault: z.string().optional(),
});

export const ListVaultFilesParamsSchema = z.object({
  path: z.string().optional().default(""),
  vault: z.string().optional(),
});

export const ListDirectoryParamsSchema = z.object({
  path: z.string().optional().default(""),
  vault: z.string().optional(),
});

export type GetFileParams = z.infer<typeof GetFileParamsSchema>;
export type CreateFileParams = z.infer<typeof CreateFileParamsSchema>;
export type AppendToFileParams = z.infer<typeof AppendToFileParamsSchema>;
export type ReplaceFileParams = z.infer<typeof ReplaceFileParamsSchema>;
export type PatchFileParams = z.infer<typeof PatchFileParamsSchema>;
export type DeleteFileParams = z.infer<typeof DeleteFileParamsSchema>;
export type ListVaultFilesParams = z.infer<typeof ListVaultFilesParamsSchema>;
export type ListDirectoryParams = z.infer<typeof ListDirectoryParamsSchema>;

// Search Operations Schemas
export const SearchVaultParamsSchema = z.object({
  query: z.string().min(1, "Query is required"),
  queryType: z.enum(["dataview", "jsonlogic"]).optional().default("dataview"),
  vault: z.string().optional(),
});

export const SimpleSearchParamsSchema = z.object({
  query: z.string().min(1, "Search query is required"),
  contextLength: z.number().int().min(0).optional().describe("Number of characters of context to include around matches"),
  vault: z.string().optional(),
});

export type SearchVaultParams = z.infer<typeof SearchVaultParamsSchema>;
export type SimpleSearchParams = z.infer<typeof SimpleSearchParamsSchema>;

// Periodic Notes Operations Schemas
export const PeriodicNoteArgsSchema = z.object({
  period: z.enum(["daily", "weekly", "monthly", "quarterly", "yearly"]).describe("The period type for the note"),
  date: z.string().optional().describe("Specific date for the note (ISO 8601 format YYYY-MM-DD). If not provided, uses current date"),
  vault: z.string().optional().describe("Name of the vault to use. If not provided, uses the active vault"),
});

export const PeriodicNoteContentArgsSchema = PeriodicNoteArgsSchema.extend({
  content: z.string().describe("Content to add or replace in the periodic note"),
});

export const PeriodicNotePatchArgsSchema = PeriodicNoteArgsSchema.extend({
  operation: z.enum(["insert", "replace", "delete"]).describe("Type of patch operation"),
  startLine: z.number().optional().describe("Starting line number for the operation (0-based)"),
  endLine: z.number().optional().describe("Ending line number for replace/delete operations (0-based, exclusive)"),
  content: z.string().optional().describe("Content to insert or replace with"),
});

export type PeriodicNoteArgs = z.infer<typeof PeriodicNoteArgsSchema>;
export type PeriodicNoteContentArgs = z.infer<typeof PeriodicNoteContentArgsSchema>;
export type PeriodicNotePatchArgs = z.infer<typeof PeriodicNotePatchArgsSchema>;