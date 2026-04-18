import VaultScreen from '../../src/screens/Vault/VaultScreen';
import TabSwipeShell from '../../src/components/ui/TabSwipeShell';

export default function VaultRoute() {
  return (
    <TabSwipeShell routeName="vault">
      <VaultScreen />
    </TabSwipeShell>
  );
}
