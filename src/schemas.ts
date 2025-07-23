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