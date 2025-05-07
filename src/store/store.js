import { configureStore } from '@reduxjs/toolkit';
import rootReducer from './reducers'; // Import root reducer

const store = configureStore({
  reducer: rootReducer,
});

export default store;