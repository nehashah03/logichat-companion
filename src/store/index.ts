import { configureStore } from '@reduxjs/toolkit';
import chatReducer from '../features/chat/chatSlice';
import sessionReducer from '../features/session/sessionSlice';

export const store = configureStore({
  reducer: {
    chat: chatReducer,
    session: sessionReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
