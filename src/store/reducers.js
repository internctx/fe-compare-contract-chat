// src/store/reducers.js
import { combineReducers } from '@reduxjs/toolkit';

// Giả sử bạn có một số slice reducer
import someSlice from './someSlice';

const rootReducer = combineReducers({
  someSlice: someSlice,
  // Các reducer khác
});

export default rootReducer;
