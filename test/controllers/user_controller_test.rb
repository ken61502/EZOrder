require 'test_helper'

class UserControllerTest < ActionController::TestCase
  test "should get order" do
    get :order
    assert_response :success
  end

end
