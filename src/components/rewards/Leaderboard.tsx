import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const Leaderboard = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Leaderboard</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <div className="text-6xl">🏁</div>
          <p className="text-lg font-medium text-center">Leaderboards coming soon!</p>
          <p className="text-sm text-muted-foreground text-center max-w-md">
            Compete with other Link2Pay users and climb the ranks. Rank-based rewards launching soon.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
