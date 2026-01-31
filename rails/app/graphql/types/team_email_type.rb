module Types
  class TeamEmailType < Types::BaseObject
    field :id, ID, null: false
    field :email, String, null: false
    field :primary, Boolean, null: false
    field :receive_trade_notifications, Boolean, null: false
  end
end
