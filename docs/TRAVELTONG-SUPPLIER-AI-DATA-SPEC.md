# 供应商 AI 数据接口说明

AI 只允许读取 `status=ACTIVE AND isVerified=true AND isPublic=true` 且至少有一项未过期、已人工复核许可证的机构。`RESEARCHED`、`VERIFIED` 但未发布、`PAUSED`、`EXPIRED` 和许可证过期机构不能进入推荐结果。

## 字段映射

| AI 字段 | 数据来源 | 规则 |
| --- | --- | --- |
| supplierId / name | `TravelSupplier` | 返回法定主体和品牌，不能合并两家法人 |
| services | `SupplierService` | 仅返回 `verified=true` 的能力 |
| destinations | `SupplierDestination` | 仅返回 `verified=true` 的目的地 |
| qualification | `SupplierLicense` + `SupplierVerification` | 返回类型、脱敏编号、核验日期和状态 |
| sources | `SupplierSource` | 返回可点击来源和可信等级 |
| freshness | `lastReviewedAt` | 超过复核周期标记 `needsManualConfirmation=true` |
| contact | `SupplierContact` | 只返回 `isPublic=true` 的企业联系方式 |

## 服务层

- `searchVerifiedSuppliers(filters)`：按出发城市、目的地、服务代码和团队类型筛选。
- `getSupplierServices(supplierId)`：读取已复核能力，不返回价格或库存。
- `getSupplierDestinations(supplierId)`：读取已复核目的地。
- `getSupplierQualificationSummary(supplierId)`：读取资质摘要、来源和新鲜度。
- `findSuppliersByRequirement(requirement)`：综合筛选，并在信息不完整时返回人工确认标记。

接口不得接受用户传入的 `userId` 代查供应商；不得生成价格、库存、线路承诺或合作关系。自动询价必须另有管理员批准、供应商书面同意、官方渠道、频控、退订和人工报价审核。

