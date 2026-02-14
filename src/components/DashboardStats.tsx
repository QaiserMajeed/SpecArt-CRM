import { useData } from '@/contexts/DataContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Target, 
  Users, 
  Flame, 
  Thermometer, 
  Snowflake,
  CheckCircle2,
  Calendar,
  AlertCircle,
  TrendingUp,
  Percent
} from 'lucide-react';

interface DashboardStatsProps {
  workspaceId: string;
}

export function DashboardStats({ workspaceId }: DashboardStatsProps) {
  const { getDashboardStats, getUpcomingFollowUps, getOverdueFollowUps } = useData();
  const stats = getDashboardStats(workspaceId);
  const upcomingFollowUps = getUpcomingFollowUps(workspaceId, 7);
  const overdueFollowUps = getOverdueFollowUps(workspaceId);

  const statCards = [
    {
      title: 'Total Leads',
      value: stats.totalLeads,
      icon: Target,
      color: 'text-[#7567F8]',
      bgColor: 'bg-[#7567F8]/10',
    },
    {
      title: 'Total Clients',
      value: stats.totalClients,
      icon: Users,
      color: 'text-[#10B981]',
      bgColor: 'bg-[#10B981]/10',
    },
    {
      title: 'Hot Leads',
      value: stats.hotLeads,
      icon: Flame,
      color: 'text-red-500',
      bgColor: 'bg-red-50',
    },
    {
      title: 'Warm Leads',
      value: stats.warmLeads,
      icon: Thermometer,
      color: 'text-orange-500',
      bgColor: 'bg-orange-50',
    },
    {
      title: 'Cold Leads',
      value: stats.coldLeads,
      icon: Snowflake,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Active Clients',
      value: stats.activeClients,
      icon: CheckCircle2,
      color: 'text-green-500',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Conversion Rate',
      value: `${stats.conversionRate}%`,
      icon: Percent,
      color: 'text-purple-500',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Today\'s Follow-ups',
      value: stats.todayFollowUps,
      icon: Calendar,
      color: 'text-[#F59E0B]',
      bgColor: 'bg-[#F59E0B]/10',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="border-0 shadow-md bg-white/80 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-[#333333]">{stat.value}</p>
                    <p className="text-xs text-gray-500">{stat.title}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Follow-ups Section */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Overdue Follow-ups */}
        <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="w-5 h-5" />
              Overdue Follow-ups ({overdueFollowUps.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {overdueFollowUps.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No overdue follow-ups!</p>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {overdueFollowUps.slice(0, 5).map((fu) => {
                  const leadClient = useData().getLeadClientById(fu.leadClientId);
                  return (
                    <div key={fu.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                      <div>
                        <p className="font-medium text-[#333333]">{leadClient?.name}</p>
                        <p className="text-sm text-gray-500">{fu.category} • {new Date(fu.date).toLocaleDateString()}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Follow-ups */}
        <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[#7567F8]">
              <TrendingUp className="w-5 h-5" />
              Upcoming Follow-ups ({upcomingFollowUps.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingFollowUps.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No upcoming follow-ups</p>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {upcomingFollowUps.slice(0, 5).map((fu) => {
                  const leadClient = useData().getLeadClientById(fu.leadClientId);
                  return (
                    <div key={fu.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-[#333333]">{leadClient?.name}</p>
                        <p className="text-sm text-gray-500">{fu.category} • {new Date(fu.date).toLocaleDateString()}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
