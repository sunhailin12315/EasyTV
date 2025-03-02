import React from 'react';
import styled from 'styled-components';

const LoadingIndicator = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: white;
  font-size: 20px;
  background-color: rgba(0, 0, 0, 0.7);
  padding: 15px 30px;
  border-radius: 8px;
`;

const ErrorMessage = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #ff5252;
  font-size: 18px;
  text-align: center;
  background-color: rgba(0, 0, 0, 0.8);
  padding: 20px;
  border-radius: 8px;
  max-width: 80%;
`;

interface LoadingAndErrorProps {
  isLoading: boolean;
  hasError: boolean;
  errorMessage: string;
}

const LoadingAndError: React.FC<LoadingAndErrorProps> = ({
  isLoading,
  hasError,
  errorMessage
}) => {
  if (isLoading) {
    return <LoadingIndicator>加载中...</LoadingIndicator>;
  }

  if (hasError) {
    return <ErrorMessage>{errorMessage}</ErrorMessage>;
  }

  return null;
};

export default LoadingAndError;