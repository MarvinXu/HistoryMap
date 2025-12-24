
/**
 * 从日期字符串中提取年份
 * 支持格式: "YYYY-MM-DD", "YYYY", "-YYYY" (BC)
 */
export const getYearFromDate = (dateStr: string): number => {
  if (!dateStr) return 0;
  // 匹配第一个数字序列，允许负号
  const match = dateStr.match(/^(-?\d+)/);
  return match ? parseInt(match[0]) : 0;
};
