import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface FreebieState {
  hasClaimedInSession: boolean;
}

const initialState: FreebieState = {
  hasClaimedInSession: false,
};

const freebieSlice = createSlice({
  name: 'freebie',
  initialState,
  reducers: {
    setClaimedInSession: (state, action: PayloadAction<boolean>) => {
      state.hasClaimedInSession = action.payload;
    },
    resetClaimedInSession: (state) => {
      state.hasClaimedInSession = false;
    },
  },
});

export const { setClaimedInSession, resetClaimedInSession } = freebieSlice.actions;
export default freebieSlice.reducer;