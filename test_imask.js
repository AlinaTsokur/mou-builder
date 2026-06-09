import React from 'react';
import { renderToString } from 'react-dom/server';
import { IMaskInput } from 'react-imask';

const Test = () => (
  <IMaskInput
    mask={Number}
    scale={2}
    thousandsSeparator=","
    radix="."
    mapToRadix={['.']}
    value="3500000"
    unmask={true}
  />
);
console.log(renderToString(<Test />));
