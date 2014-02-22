class Database < ActiveRecord::Base
  include ActionView::Helpers::TextHelper

  attr_accessible :name, :adapter, :encoding, :host, :port, :database_name, :username, :password

  serialize :schema
  serialize :relations

  after_create :build_schema_and_relations

  RAILS_TABLES = {"schema_migrations" => true}

  def connect
    ClientBase.establish_connection( 
      adapter: adapter, 
      encoding: encoding, 
      host: host, 
      post: 5432, 
      database: database_name, 
      pool: 5, 
      username: username, 
      password: password)
  end

  def build_schema
    schema = Hash.new
    ClientBase.connection.tables.each do |table_name|
      next if RAILS_TABLES.has_key?(table_name)

      klass = Class.new(ClientBase) do
        set_table_name table_name
      end

      schema[table_name] = klass.columns.map { |c| [c.name, c.type, c.sql_type]}
    end
    self.schema = schema
  end

  def build_relations

    relations = Hash.new { Array.new }

    self.schema.each do |table_name, columns|
      columns.each do |column_name, _1, _2|
        if column_name.match(/.+_id$/)
          relation = column_name.gsub(/_id$/, "")
          if self.schema.has_key?(relation.pluralize)
            relations[table_name] = relations[table_name].push(["belongs_to", relation])
            relations[relation.pluralize] = relations[relation.pluralize].push(["has_many", table_name.pluralize])
          end
        end
      end
    end

    self.relations = relations
  end

  def build_classes
    self.schema.each do |table_name, _|

      class_name = table_name.classify

      relations = self.relations[table_name]

      klass = Class.new(ClientBase) do
        set_table_name table_name

        relations.each do |relationship, table_name|
          p relationship
          p table_name
          self.send(relationship, table_name)
        end
      end

      Client.const_set(class_name, klass)
    end
  end
end