import PropTypes from 'prop-types';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation } from 'react-apollo';

import { SafeAreaViewFlex } from '../../../SafeAreaViewFlex';
import { Title, TitleContainer, TitleShadow } from '../../../Title';
import { Wrapper, WrapperVertical, WrapperWithOrientation } from '../../../Wrapper';
import { Button } from '../../../Button';
import { Input, ConsulCommentList, ConsulQuestionsList } from '../../../Consul';
import { consts, device, texts } from '../../../../config';
import { ConsulClient } from '../../../../ConsulClient';
import { ADD_COMMENT_TO_POLLS } from '../../../../queries/Consul';

const text = texts.consul;
const a11yText = consts.a11yLabel;

/* eslint-disable complexity */
/* NOTE: we need to check a lot for presence, so this is that complex */
export const PollDetail = ({ listData, onRefresh }) => {
  const [loading, setLoading] = useState();

  const { commentsCount, comments, questions, id, title } = listData.poll;

  // React Hook Form
  const { control, handleSubmit, reset } = useForm();

  // GraphQL
  const [addCommentToPoll] = useMutation(ADD_COMMENT_TO_POLLS, {
    client: ConsulClient
  });

  const onSubmit = async (val) => {
    setLoading(true);
    await addCommentToPoll({ variables: { pollId: id, body: val.comment } })
      .then(() => {
        onRefresh();
        setLoading(false);
        reset({ comment: null });
      })
      .catch((err) => console.error(err));
  };

  return (
    <SafeAreaViewFlex>
      <WrapperWithOrientation>
        {/* Title! */}
        {!!title && (
          <>
            <TitleContainer>
              <Title accessibilityLabel={`(${title}) ${a11yText.heading}`}>{title}</Title>
            </TitleContainer>
            {device.platform === 'ios' && <TitleShadow />}
          </>
        )}

        {/* Question! */}
        {!!questions && <ConsulQuestionsList data={questions} />}

        {/* Comments List! */}
        {!!comments && (
          <ConsulCommentList
            commentCount={commentsCount}
            commentsData={comments}
            onRefresh={onRefresh}
          />
        )}

        {/* New Comment Input! */}
        <Wrapper>
          <Input
            multiline
            minHeight={50}
            name="comment"
            label={text.commentLabel}
            placeholder={text.comment}
            autoCapitalize="none"
            rules={{ required: text.commentEmptyError }}
            control={control}
          />
          <WrapperVertical>
            <Button
              onPress={handleSubmit(onSubmit)}
              title={loading ? text.submittingCommentButton : text.commentAnswerButton}
              disabled={loading}
            />
          </WrapperVertical>
        </Wrapper>
      </WrapperWithOrientation>
    </SafeAreaViewFlex>
  );
};
/* eslint-enable complexity */

PollDetail.propTypes = {
  listData: PropTypes.object.isRequired,
  onRefresh: PropTypes.func
};
