import { Provider } from "react-redux";
import { store } from "./app/store";
import { ThemeProvider } from "./app/providers/ThemeProvider";
import { LanguageProvider } from "./app/providers/LanguageProvider";
import { AppRouter } from "./app/router";

export default function App() {
  return (
    <Provider store={store}>
      <ThemeProvider>
        <LanguageProvider>
          <AppRouter />
        </LanguageProvider>
      </ThemeProvider>
    </Provider>
  );
}
