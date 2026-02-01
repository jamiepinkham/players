class ContractTrade < ApplicationRecord
  self.table_name = 'contracts_trades'

  belongs_to :contract
  belongs_to :trade
end
