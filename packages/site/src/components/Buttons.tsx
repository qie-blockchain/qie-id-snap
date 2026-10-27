import type { ComponentProps } from 'react';
import styled from 'styled-components';

import { ReactComponent as FlaskFox } from '../assets/flask_fox.svg';
import { ReactComponent as MetaMaskFox } from '../assets/metamask_fox.svg';
import { defaultSnapOrigin } from '../config';
import { useMetaMask, useRequestSnap } from '../hooks';
import { isLocalSnap, shouldDisplayReconnectButton } from '../utils';

const isLocal = isLocalSnap(defaultSnapOrigin);
const Fox = isLocal ? FlaskFox : MetaMaskFox;

const Link = styled.a`
  display: flex;
  align-self: flex-start;
  align-items: center;
  justify-content: center;
  font-size: ${(props) => props.theme.fontSizes.small};
  border-radius: ${(props) => props.theme.radii.button};
  border: 1px solid ${(props) => props.theme.colors.background?.inverse};
  background-color: ${(props) => props.theme.colors.background?.inverse};
  color: ${(props) => props.theme.colors.text?.inverse};
  text-decoration: none;
  font-weight: bold;
  padding: 1rem;
  cursor: pointer;
  transition: all 0.2s ease-in-out;

  &:hover {
    background-color: transparent;
    border: 1px solid ${(props) => props.theme.colors.background?.inverse};
    color: ${(props) => props.theme.colors.text?.default};
  }

  ${({ theme }) => theme.mediaQueries.small} {
    width: 100%;
    box-sizing: border-box;
  }
`;

const Button = styled.button`
  display: flex;
  align-self: flex-start;
  align-items: center;
  justify-content: center;
  margin-top: auto;
  ${({ theme }) => theme.mediaQueries.small} {
    width: 100%;
  }
`;

const ButtonText = styled.span`
  margin-left: 1rem;
`;

const ConnectedContainer = styled.div`
  display: flex;
  align-self: flex-start;
  align-items: center;
  justify-content: center;
  font-size: ${(props) => props.theme.fontSizes.small};
  border-radius: ${(props) => props.theme.radii.button};
  border: 1px solid ${(props) => props.theme.colors.background?.inverse};
  background-color: ${(props) => props.theme.colors.background?.inverse};
  color: ${(props) => props.theme.colors.text?.inverse};
  font-weight: bold;
  padding: 1.2rem;
`;

const ConnectedIndicator = styled.div`
  content: ' ';
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: green;
`;

export const InstallMetaMaskButton = () => (
  <Link
    href={
      isLocal ? 'https://metamask.io/flask/' : 'https://metamask.io/download/'
    }
    target="_blank"
  >
    <Fox />
    <ButtonText>{isLocal ? 'Get MetaMask Flask' : 'Get MetaMask'}</ButtonText>
  </Link>
);

export const InstallButton = (props: ComponentProps<typeof Button>) => {
  return (
    <Button {...props}>
      <Fox />
      <ButtonText>Install</ButtonText>
    </Button>
  );
};

export const ReconnectButton = (props: ComponentProps<typeof Button>) => {
  return (
    <Button {...props}>
      <Fox />
      <ButtonText>Reconnect</ButtonText>
    </Button>
  );
};

export const HeaderButtons = () => {
  const requestSnap = useRequestSnap();
  const { isMetaMaskReady, installedSnap } = useMetaMask();

  if (!isMetaMaskReady && !installedSnap) {
    return <InstallMetaMaskButton />;
  }

  if (!installedSnap) {
    return <InstallButton onClick={requestSnap} />;
  }

  if (shouldDisplayReconnectButton(installedSnap)) {
    return <ReconnectButton onClick={requestSnap} />;
  }

  return (
    <ConnectedContainer>
      <ConnectedIndicator />
      <ButtonText>Installed</ButtonText>
    </ConnectedContainer>
  );
};
