/* app/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --cream:       #FDF8F0;
  --cream-dark:  #F5EDD8;
  --teal:        #0F4C5C;
  --teal-mid:    #2D6E7E;
  --teal-light:  #D4E9ED;
  --amber:       #E89B3C;
  --amber-light: #FDF0DC;
  --amber-dark:  #B5731C;
  --ink:         #1A2832;
  --body:        #3D4D58;
  --muted:       #7A8D97;
  --border:      #E2D9C8;
}

html { scroll-behavior: smooth; }

body {
  background: var(--cream);
  color: var(--ink);
}

/* Scrollbar halus */
::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-track { background: var(--cream-dark); }
::-webkit-scrollbar-thumb { background: var(--teal-light); border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: var(--teal-mid); }

/* Chat bubble typing animation */
@keyframes bounce-dot {
  0%, 80%, 100% { transform: translateY(0); }
  40% { transform: translateY(-6px); }
}
.typing-dot:nth-child(1) { animation: bounce-dot 1.2s infinite 0s; }
.typing-dot:nth-child(2) { animation: bounce-dot 1.2s infinite 0.15s; }
.typing-dot:nth-child(3) { animation: bounce-dot 1.2s infinite 0.3s; }

/* Fade in untuk pesan baru */
@keyframes fadeSlideUp {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}
.message-enter { animation: fadeSlideUp 0.25s ease forwards; }
