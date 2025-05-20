module Types
    class StatType < Types::BaseObject
      field :title, String, null: false #, hash_key: 'title'
      field :value, String, null: true #, hash_key: 'value'
    end
end
  