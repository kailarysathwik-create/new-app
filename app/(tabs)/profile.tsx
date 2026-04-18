import ProfileScreen from '../../src/screens/Profile/ProfileScreen';
import TabSwipeShell from '../../src/components/ui/TabSwipeShell';

export default function ProfileRoute() {
  return (
    <TabSwipeShell routeName="profile">
      <ProfileScreen />
    </TabSwipeShell>
  );
}
