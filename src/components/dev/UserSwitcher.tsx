/**
 * Dev Mode User Switcher
 * Allows switching between test users without logging in/out
 * ONLY VISIBLE IN DEV MODE
 */

import { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { Users, ChevronDown } from "lucide-react";

const DEV_TEST_USERS = [
  { id: "user-a-uuid-123", email: "alice@test.com", name: "Alice" },
  { id: "user-b-uuid-456", email: "bob@test.com", name: "Bob" },
  { id: "user-c-uuid-789", email: "charlie@test.com", name: "Charlie" },
];

export default function UserSwitcher() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  // Only show in dev mode
  if (import.meta.env.PROD) {
    return null;
  }

  const currentDevUser = DEV_TEST_USERS.find((u) => u.id === user?.id);

  const handleUserSwitch = (testUser: (typeof DEV_TEST_USERS)[0]) => {
    // This is a MOCK implementation
    // In reality, you'd need to update the AuthContext's user state
    console.log(`Switching to ${testUser.name}...`);
    console.warn(
      "UserSwitcher is a mock component. To make this work, you need to:"
    );
    console.warn("1. Add a 'setUser' function to AuthContext");
    console.warn("2. Call setUser here with the test user");
    console.warn("3. Or use Supabase's auth.updateUser() / setSession()");

    // Example of what you'd do:
    // setUser({
    //   id: testUser.id,
    //   email: testUser.email,
    //   // ... other user fields
    // });

    setIsOpen(false);
  };

  return (
    <div className="fixed bottom-20 left-4 z-50">
      <div className="relative">
        {/* Trigger Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3 py-2 text-xs bg-gray-800 text-gray-300 rounded-lg shadow-lg hover:bg-gray-700 transition-colors border border-gray-700"
        >
          <Users className="w-3 h-3" />
          <span className="font-medium">
            {currentDevUser?.name || "Unknown User"}
          </span>
          <ChevronDown className="w-3 h-3" />
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Menu */}
            <div className="absolute bottom-full mb-2 left-0 bg-gray-800 rounded-lg shadow-xl border border-gray-700 overflow-hidden z-50 min-w-[180px]">
              <div className="px-3 py-2 border-b border-gray-700">
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                  Switch Test User
                </div>
              </div>

              {DEV_TEST_USERS.map((testUser) => (
                <button
                  key={testUser.id}
                  onClick={() => handleUserSwitch(testUser)}
                  className={`
                    w-full px-3 py-2 text-left text-sm hover:bg-gray-700 transition-colors
                    ${
                      testUser.id === user?.id
                        ? "bg-gray-700 text-white"
                        : "text-gray-300"
                    }
                  `}
                >
                  <div className="font-medium">{testUser.name}</div>
                  <div className="text-xs text-gray-500">{testUser.email}</div>
                </button>
              ))}

              <div className="px-3 py-2 border-t border-gray-700">
                <div className="text-xs text-gray-500 italic">
                  Dev mode only
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
