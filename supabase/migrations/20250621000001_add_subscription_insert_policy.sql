-- Add policy to allow users to insert their own subscription records
CREATE POLICY "Users can insert their own subscription"
  ON user_subscriptions
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());
