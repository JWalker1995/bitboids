import React from 'react';

import Context from './Context';
import Renderer from './Renderer';

const SceneContainer = ({ context }: { context: Context }) => {
  const containerRef = React.useCallback((node: HTMLDivElement) => {
    const view = context.get(Renderer).getView();

    view.parentNode && view.parentNode.removeChild(view);

    if (node !== null) {
      const { width, height } = node.getBoundingClientRect();
      context.get(Renderer).setSize(width, height);
      node.appendChild(view);
    }
  }, []);

  return <div style={{ flex: 1, overflow: 'hidden' }} ref={containerRef}></div>;
};

export default SceneContainer;
