import { darkTheme, lightTheme } from "@rainbow-me/rainbowkit";

const rainbowkitTheme = (resolvedTheme: string | undefined) => {
  return resolvedTheme === "dark"
    ? darkTheme({
        accentColor: "#00ffa3",
        accentColorForeground: "#003920",
        borderRadius: "medium",
      })
    : lightTheme({
        accentColor: "#00ffa3",
        accentColorForeground: "#003920",
        borderRadius: "medium",
      });
};

export default rainbowkitTheme;
