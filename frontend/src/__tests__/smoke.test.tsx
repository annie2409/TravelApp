import { render, screen } from '@testing-library/react';

function Hello({ name }: { name: string }) {
  return <h1>Hello, {name}!</h1>;
}

describe('Hello smoke', () => {
  it('renders the greeting', () => {
    render(<Hello name="WanderSync" />);
    expect(screen.getByRole('heading')).toHaveTextContent('Hello, WanderSync!');
  });
});
