require 'test_helper'

class AdminPasswordResetTest < ActionDispatch::IntegrationTest
  setup do
    # Create admin user
    @admin = User.create!(
      username: 'admin_user',
      password: 'adminpassword123',
      password_confirmation: 'adminpassword123',
      is_admin: true
    )

    # Create regular user
    @user = User.create!(
      username: 'regular_user',
      password: 'userpassword123',
      password_confirmation: 'userpassword123',
      is_admin: false
    )

    # Sign in as admin using Devise helper
    sign_in @admin
  end

  test "admin can access reset password page" do
    get rails_admin.reset_user_password_path(model_name: 'user', id: @user.id)
    assert_response :success
    assert_select 'h1', text: "Reset Password for #{@user.username}"
  end

  test "reset password form displays correctly" do
    get rails_admin.reset_user_password_path(model_name: 'user', id: @user.id)

    assert_select 'input[type=password][name=password]'
    assert_select 'input[type=password][name=password_confirmation]'
    assert_select 'input[type=submit]'
  end

  test "successfully reset password with valid input" do
    new_password = 'newsecurepassword123'

    post rails_admin.reset_user_password_path(model_name: 'user', id: @user.id),
         params: {
           password: new_password,
           password_confirmation: new_password
         }

    assert_redirected_to rails_admin.index_path(model_name: 'user')
    follow_redirect!

    assert_match /Password successfully reset/, flash[:success]
    assert_match new_password, flash[:success], "Flash should display new password"

    # Verify user can login with new password
    @user.reload
    assert @user.valid_password?(new_password), "User should be able to login with new password"

    # Verify old password no longer works
    assert_not @user.valid_password?('userpassword123'), "Old password should not work"
  end

  test "reject password that is too short" do
    post rails_admin.reset_user_password_path(model_name: 'user', id: @user.id),
         params: {
           password: 'short',
           password_confirmation: 'short'
         }

    assert_redirected_to rails_admin.index_path(model_name: 'user')
    follow_redirect!

    assert_match /must be at least 8 characters/, flash[:error]

    # Verify password was not changed
    @user.reload
    assert @user.valid_password?('userpassword123'), "Original password should still work"
  end

  test "reject password that is too long" do
    long_password = 'a' * 73

    post rails_admin.reset_user_password_path(model_name: 'user', id: @user.id),
         params: {
           password: long_password,
           password_confirmation: long_password
         }

    assert_redirected_to rails_admin.index_path(model_name: 'user')
    follow_redirect!

    assert_match /must be less than 72 characters/, flash[:error]

    # Verify password was not changed
    @user.reload
    assert @user.valid_password?('userpassword123'), "Original password should still work"
  end

  test "reject blank password" do
    post rails_admin.reset_user_password_path(model_name: 'user', id: @user.id),
         params: {
           password: '',
           password_confirmation: ''
         }

    assert_redirected_to rails_admin.index_path(model_name: 'user')
    follow_redirect!

    assert_match /cannot be blank/, flash[:error]

    # Verify password was not changed
    @user.reload
    assert @user.valid_password?('userpassword123'), "Original password should still work"
  end

  test "reject mismatched passwords" do
    post rails_admin.reset_user_password_path(model_name: 'user', id: @user.id),
         params: {
           password: 'password123',
           password_confirmation: 'different123'
         }

    assert_redirected_to rails_admin.index_path(model_name: 'user')
    follow_redirect!

    assert_match /do not match/, flash[:error]

    # Verify password was not changed
    @user.reload
    assert @user.valid_password?('userpassword123'), "Original password should still work"
  end

  test "admin can reset another admin's password" do
    other_admin = User.create!(
      username: 'other_admin',
      password: 'otheradminpass123',
      password_confirmation: 'otheradminpass123',
      is_admin: true
    )

    new_password = 'resetadminpass123'

    post rails_admin.reset_user_password_path(model_name: 'user', id: other_admin.id),
         params: {
           password: new_password,
           password_confirmation: new_password
         }

    assert_redirected_to rails_admin.index_path(model_name: 'user')
    follow_redirect!

    assert_match /Password successfully reset/, flash[:success]

    # Verify the other admin can login with new password
    other_admin.reload
    assert other_admin.valid_password?(new_password), "Other admin should be able to login with new password"
  end

  test "non-admin cannot access reset password action" do
    sign_out @admin
    sign_in @user

    get rails_admin.reset_user_password_path(model_name: 'user', id: @user.id)

    assert_redirected_to main_app.root_path
    follow_redirect!
    assert_match /administrator/, flash[:error]
  end

  test "password displayed in flash message after successful reset" do
    new_password = 'flashtestpassword123'

    post rails_admin.reset_user_password_path(model_name: 'user', id: @user.id),
         params: {
           password: new_password,
           password_confirmation: new_password
         }

    follow_redirect!

    # Verify the actual password is displayed in the flash message
    assert_match new_password, flash[:success],
                 "Flash message should contain the plain text password for admin to communicate to user"
    assert_match /communicate this password/, flash[:notice],
                 "Flash should remind admin to communicate password to user"
  end
end
