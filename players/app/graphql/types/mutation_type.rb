module Types
  class MutationType < Types::BaseObject
    field :create_bid, mutation: Mutations::CreateBidMutation
    field :create_trade, mutation: Mutations::CreateTradeMutation
    field :accept_trade, mutation: Mutations::AcceptTradeMutation
    field :reject_trade, mutation: Mutations::RejectTradeMutation
  end
end
