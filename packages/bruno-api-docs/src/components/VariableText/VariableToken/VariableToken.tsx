import React from 'react';
import { useResolvedVariables } from '@/hooks';
import { Popover } from '@/ui/Popover/Popover';
import { detectSpecialScope, isValidVariableName } from '@/utils/variableResolution';
import { VariableInfoCard } from '../../VariableInfoCard/VariableInfoCard';
import { StyledWrapper } from './StyledWrapper';

const EMPTY_PLACEHOLDER = '(empty)';

export const VariableToken: React.FC<{ token: string; highlighted?: boolean }> = ({ token, highlighted = true }) => {
  const { showVars, resolve, isFound, isSecret } = useResolvedVariables();
  const name = token.slice(2, -2).trim();
  const resolved = showVars ? resolve(token) : token;
  const revealed = resolved !== token;

  const plainVariable = isValidVariableName(name) && !isSecret(name) && !detectSpecialScope(name);
  const empty = showVars && plainVariable && (resolved === '' || !isFound(name));

  const display = empty ? EMPTY_PLACEHOLDER : resolved;
  const variant = highlighted ? 'var-highlight' : revealed ? undefined : 'var-plain';

  return (
    <Popover
      content={<VariableInfoCard name={name} />}
      testId="variable-info-popover"
      disabled={revealed || empty}
    >
      <StyledWrapper
        className={['var', variant, empty ? 'var-empty' : null].filter(Boolean).join(' ')}
        data-var-name={name}
        data-testid={`variable-token-${name}`}
        translate="no"
      >
        {display}
      </StyledWrapper>
    </Popover>
  );
};

export default VariableToken;
