import ChatListScreen from '../../src/screens/Chat/ChatListScreen';
import TabSwipeShell from '../../src/components/ui/TabSwipeShell';

export default function ChatRoute() {
  return (
    <TabSwipeShell routeName="chat">
      <ChatListScreen />
    </TabSwipeShell>
  );
}
