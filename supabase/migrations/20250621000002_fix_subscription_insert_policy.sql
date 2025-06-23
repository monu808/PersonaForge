-- Add INSERT policy for user_subscriptions table
CREATE POLICY "Users can insert their own subscription"
  ON user_subscriptions
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());
