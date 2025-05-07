// src/store/someSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  value: 0,
};

const someSlice = createSlice({
  name: 'someSlice',
  initialState,
  reducers: {
    increment: (state) => {
      state.value += 1;
    },
    decrement: (state) => {
      state.value -= 1;
    },
  },
});

// Export các action để sử dụng trong các component
export const { increment, decrement } = someSlice.actions;

// Export reducer để kết hợp vào rootReducer
export default someSlice.reducer;
