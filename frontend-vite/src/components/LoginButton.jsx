import { signInWithPopup } from "firebase/auth";
import { auth, provider } from "../firebase";

export default function LoginButton() {
  const handleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      console.log("User:", result.user);
      alert(`Welcome, ${result.user.displayName}`);
    } catch (error) {
      console.error("Login failed:", error);
      alert("Login failed. Check console.");
    }
  };

  return (
    <button
      onClick={handleLogin}
      className="w-full flex items-center justify-center gap-2 px-6 py-3 border border-teal-600 text-teal-600 bg-transparent rounded-xl text-lg hover:bg-teal-50 transition"
    >
      <svg
        className="w-5 h-5"
        viewBox="0 0 533.5 544.3"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          fill="#4285f4"
          d="M533.5 278.4c0-17.6-1.5-34.5-4.3-50.8H272v95.7h146.9c-6.4 34.4-25.5 63.6-54.4 83.1v68h87.7c51.3-47.3 81.3-117 81.3-196z"
        />
        <path
          fill="#34a853"
          d="M272 544.3c73.7 0 135.4-24.5 180.5-66.7l-87.7-68c-24.3 16.3-55.5 26-92.8 26-71.3 0-131.8-48.1-153.5-112.9H26.1v70.8c45.4 89.8 138.6 150.8 245.9 150.8z"
        />
        <path
          fill="#fbbc04"
          d="M118.5 322.5c-10.7-32-10.7-66.5 0-98.5v-70.8H26.1c-37.4 73.6-37.4 160.1 0 233.7l92.4-64.4z"
        />
        <path
          fill="#ea4335"
          d="M272 107.7c39.9 0 75.8 13.7 104.1 40.6l78.1-78.1C407.4 25.2 345.7 0 272 0 164.7 0 71.5 61 26.1 150.8l92.4 70.8c21.7-64.8 82.2-112.9 153.5-112.9z"
        />
      </svg>
      Sign In
    </button>
  );
}
