import FeedScreen from '../../src/screens/Feed/FeedScreen';
import TabSwipeShell from '../../src/components/ui/TabSwipeShell';

export default function FeedRoute() {
  return (
    <TabSwipeShell routeName="index">
      <FeedScreen />
    </TabSwipeShell>
  );
}
