'use client';

import { Provider } from 'react-redux';
import { store } from '@/store/index';
import CartHydrator from '@/components/providers/CartHydrator';
import ConditionalAuthBootstrap from '@/store/ConditionalAuthBootstrap';

type Props = {
  children: React.ReactNode;
};

export default function StoreProvider({ children }: Props) {
  return (
    <Provider store={store}>
      <CartHydrator />
      <ConditionalAuthBootstrap />
      {children}
    </Provider>
  );
}