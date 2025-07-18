import { useQueryClient } from "@tanstack/react-query";

export function useCreditCache() {
  const queryClient = useQueryClient();

  const invalidateCreditHistory = () => {
    // Invalidate credit usage history cache
    queryClient.invalidateQueries({ 
      queryKey: ['/api/dashboard/credit-usage-history'] 
    });
    
    // Also invalidate user stats cache which shows credits
    queryClient.invalidateQueries({ 
      queryKey: ['/api/dashboard/stats'] 
    });
    
    // Invalidate user data cache
    queryClient.invalidateQueries({ 
      queryKey: ['/api/user'] 
    });
  };

  return {
    invalidateCreditHistory
  };
}