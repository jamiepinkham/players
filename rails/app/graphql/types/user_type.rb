module Types
  class UserType  < Types::BaseObject
    field :id, ID, null: false
    field :username, String, null: false
    field :name, String, null: true
    field :is_admin, Boolean, null: false
  end
end
