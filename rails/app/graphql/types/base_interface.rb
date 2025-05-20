module Types
  module BaseInterface
    include GraphQL::Schema::Interface
    edge_type_class(Types::BaseEdge)
    connection_type_class(Types::BaseConnection)
    include GraphQL::Types::Relay::NodeBehaviors
    field_class Types::BaseField
  end
end
