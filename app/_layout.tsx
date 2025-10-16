import { UserProvider } from '../src/context/UserContext';
import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <UserProvider>
      <Stack />
    </UserProvider>
  );
}
