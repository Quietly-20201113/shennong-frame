/**
 * 神农信息系统 · 数据权限范围（DataScope）
 *
 * 与后端 enum 保持一致，全大写命名。
 * 5 档覆盖绝大多数 ERP 数据隔离场景；CUSTOM 留作扩展占位。
 *
 * 参考：AI 聊天系统设计文档 07-管理后台设计 § 2-3 RBAC 模型
 */
export type DataScope =
  /** 仅本人数据 */
  | 'ALL'
  /** 仅本部门数据 */
  | 'CUSTOM'
  /** 本部门 + 所有子部门数据 */
  | 'OWN_DEPT'
  /** 全部数据 */
  | 'OWN_DEPT_AND_CHILDREN'
  /** 自定义部门列表（配合 customDeptIds 使用） */
  | 'SELF';

/**
 * 数据权限上下文：判断单条记录是否对当前用户可见
 */
export interface DataScopeContext {
  /** 数据归属部门的所有上级部门 ID 链（含自身），用于 OWN_DEPT_AND_CHILDREN 反向判断 */
  deptAncestorIds?: Array<number | string>;
  /** 数据归属部门 ID */
  deptId?: number | string;
  /** 数据归属人 ID */
  ownerId?: number | string;
}
