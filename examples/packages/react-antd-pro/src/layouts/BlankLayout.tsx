import React from 'react';
import CopyBlock from '@/components/CopyBlock';

const Layout: React.FC = ({ children }) => (
  <>
    <div>{children}</div>
    <CopyBlock id={Date.now()} />
  </>
);

export default Layout;
