export const getLimits = (userTier) => {
  if (userTier === 'pro') {
    return { projects: 999, resources: 999, areas: 999, archives: 999, expenseCategories: 999 };
  }
  // Free tier defaults
  return { 
    projects: 5, 
    resources: 20, 
    areas: 2, 
    archives: 25,
    expenseCategories: 2
  };
};

export const canPerformAction = (userTier, category, currentCount) => {
  const limits = getLimits(userTier);
  const limit = limits[category];
  return limit === undefined || currentCount < limit;
};
