import ExploreScreen from '../../src/screens/Feed/ExploreScreen';
import TabSwipeShell from '../../src/components/ui/TabSwipeShell';

export default function ExploreRoute() {
  return (
    <TabSwipeShell routeName="explore">
      <ExploreScreen />
    </TabSwipeShell>
  );
}
